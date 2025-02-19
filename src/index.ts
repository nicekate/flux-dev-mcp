#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const API_KEY = process.env.CEPHALON_API_KEY;
const MODEL_ID = process.env.CEPHALON_MODEL_ID;
const DEFAULT_WORKING_DIR = process.env.CLINE_WORKING_DIR || process.cwd();

// 检查必要的环境变量
if (!API_KEY) {
  throw new Error('CEPHALON_API_KEY environment variable is required');
}

if (!MODEL_ID) {
  throw new Error('CEPHALON_MODEL_ID environment variable is required');
}

// 跨平台文件权限设置
const setExecutablePermissions = (filePath: string) => {
  if (os.platform() !== 'win32') {
    try {
      fs.chmodSync(filePath, '755');
    } catch (error) {
      console.warn(`Warning: Could not set executable permissions on ${filePath}`);
    }
  }
};

// 确保路径分隔符正确
const normalizePath = (inputPath: string) => {
  return path.normalize(inputPath).replace(/[\\/]+/g, path.sep);
};

interface GenerateImageArgs {
  prompt: string;
  width?: number;
  height?: number;
  guidance_scale?: number;
  seed?: number;
  steps?: number;
  output_filename?: string;
  output_dir?: string;
}

const isValidGenerateImageArgs = (args: any): args is GenerateImageArgs => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.prompt === 'string' &&
    (args.width === undefined || typeof args.width === 'number') &&
    (args.height === undefined || typeof args.height === 'number') &&
    (args.guidance_scale === undefined || typeof args.guidance_scale === 'number') &&
    (args.seed === undefined || typeof args.seed === 'number') &&
    (args.steps === undefined || typeof args.steps === 'number') &&
    (args.output_filename === undefined || typeof args.output_filename === 'string') &&
    (args.output_dir === undefined || typeof args.output_dir === 'string')
  );
};

class FluxDevServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'flux-dev-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    // 跨平台信号处理
    if (os.platform() === 'win32') {
      if (process.stdin.isTTY) {
        require('readline')
          .createInterface({
            input: process.stdin,
            output: process.stdout
          })
          .on('SIGINT', () => {
            process.emit('SIGINT', 'SIGINT');
          });
      }
    }
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_image',
          description: 'Generate an image using ComfyUI model',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Text prompt describing the desired image',
              },
              width: {
                type: 'number',
                description: 'Image width in pixels (default: 1024)',
              },
              height: {
                type: 'number',
                description: 'Image height in pixels (default: 1024)',
              },
              guidance_scale: {
                type: 'number',
                description: 'Guidance scale for image generation (default: 3.5)',
              },
              seed: {
                type: 'number',
                description: 'Random seed for reproducibility',
              },
              steps: {
                type: 'number',
                description: 'Number of generation steps (default: 25)',
              },
              output_filename: {
                type: 'string',
                description: 'Output filename for the generated image (default: generated_{timestamp}.png)',
              },
              output_dir: {
                type: 'string',
                description: 'Output directory path (default: current working directory)',
              },
            },
            required: ['prompt'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'generate_image') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!isValidGenerateImageArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid generate_image arguments'
        );
      }

      try {
        const {
          prompt,
          width = 1024,
          height = 1024,
          guidance_scale = 3.5,
          seed = Math.floor(Math.random() * 1000000000),
          steps = 25,
          output_filename = `generated_${Date.now()}.png`,
          output_dir = DEFAULT_WORKING_DIR,
        } = request.params.arguments;

        const response = await axios({
          method: 'post',
          url: 'https://cephalon.cloud/user-center/v1/model/comfyui',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Model-Id': MODEL_ID,
            'Content-Type': 'application/json',
          },
          data: {
            prompt,
            width,
            height,
            guidance_scale,
            seed,
            steps,
          },
          responseType: 'arraybuffer',
        });

        // 跨平台创建目录
        const normalizedOutputDir = normalizePath(output_dir);
        if (!fs.existsSync(normalizedOutputDir)) {
          fs.mkdirSync(normalizedOutputDir, { recursive: true });
        }

        // 使用规范化的路径保存文件
        const outputPath = normalizePath(path.join(normalizedOutputDir, output_filename));
        fs.writeFileSync(outputPath, response.data);

        // 设置可执行权限（仅在非Windows系统）
        setExecutablePermissions(outputPath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                output_file: outputPath,
                parameters: {
                  prompt,
                  width,
                  height,
                  guidance_scale,
                  seed,
                  steps,
                  output_dir: normalizedOutputDir,
                },
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Flux Dev MCP server running on stdio');
  }
}

const server = new FluxDevServer();
server.run().catch(console.error);
