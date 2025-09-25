#!/bin/bash

# AI角色语音聊天 - 信令服务器启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# 检查Node.js版本
check_node_version() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"

    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js 版本过低，当前版本: $NODE_VERSION，要求版本: >= $REQUIRED_VERSION"
        exit 1
    fi

    print_info "Node.js 版本检查通过: $NODE_VERSION"
}

# 检查依赖
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "依赖未安装，正在安装..."
        npm install
    else
        print_info "依赖检查完成"
    fi
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_warning ".env 文件不存在，从 .env.example 复制..."
            cp .env.example .env
            print_info "已创建 .env 文件，请根据需要修改配置"
        else
            print_warning ".env 和 .env.example 文件都不存在，使用默认配置"
        fi
    else
        print_info "环境变量文件检查完成"
    fi
}

# 检查端口占用
check_port() {
    PORT=${PORT:-3001}
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        print_error "端口 $PORT 已被占用，请检查或修改 PORT 环境变量"
        print_info "当前占用端口 $PORT 的进程："
        lsof -Pi :$PORT -sTCP:LISTEN
        exit 1
    else
        print_info "端口 $PORT 可用"
    fi
}

# 创建日志目录
create_log_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        print_info "已创建日志目录: logs/"
    fi
}

# 启动服务器
start_server() {
    MODE=${1:-"dev"}
    
    print_message "🚀 启动 AI语音聊天信令服务器..."
    print_info "启动模式: $MODE"
    print_info "服务端口: ${PORT:-3001}"
    print_info "环境: ${NODE_ENV:-development}"
    
    case $MODE in
        "dev"|"development")
            print_info "开发模式启动（自动重启）"
            npm run dev
            ;;
        "prod"|"production")
            print_info "生产模式启动"
            NODE_ENV=production npm start
            ;;
        "pm2")
            print_info "PM2 模式启动"
            if ! command -v pm2 &> /dev/null; then
                print_warning "PM2 未安装，正在安装..."
                npm install -g pm2
            fi
            pm2 start server.js --name "ai-chat-signaling" --env production
            pm2 save
            pm2 startup
            print_message "✅ 服务已通过 PM2 启动"
            print_info "查看状态: pm2 status"
            print_info "查看日志: pm2 logs ai-chat-signaling"
            ;;
        "docker")
            print_info "Docker 模式启动"
            if [ -f "Dockerfile" ]; then
                docker build -t ai-chat-signaling .
                docker run -p ${PORT:-3001}:${PORT:-3001} --env-file .env ai-chat-signaling
            else
                print_error "Dockerfile 不存在"
                exit 1
            fi
            ;;
        *)
            print_error "未知的启动模式: $MODE"
            print_info "支持的模式: dev, prod, pm2, docker"
            exit 1
            ;;
    esac
}

# 停止服务器
stop_server() {
    print_message "🛑 停止信令服务器..."
    
    # 停止PM2进程
    if command -v pm2 &> /dev/null; then
        pm2 stop ai-chat-signaling 2>/dev/null || true
        pm2 delete ai-chat-signaling 2>/dev/null || true
        print_info "已停止 PM2 进程"
    fi
    
    # 停止占用端口的进程
    PORT=${PORT:-3001}
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        print_info "正在停止占用端口 $PORT 的进程..."
        kill -9 $(lsof -Pi :$PORT -sTCP:LISTEN -t) 2>/dev/null || true
    fi
    
    print_message "✅ 服务器已停止"
}

# 重启服务器
restart_server() {
    stop_server
    sleep 2
    start_server $1
}

# 显示状态
show_status() {
    PORT=${PORT:-3001}
    
    print_message "📊 信令服务器状态"
    
    # 检查端口占用
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        print_info "✅ 服务器运行中 (端口: $PORT)"
        
        # 尝试获取健康检查
        if command -v curl &> /dev/null; then
            print_info "正在检查服务器健康状态..."
            curl -s "http://localhost:$PORT/health" | python3 -m json.tool 2>/dev/null || print_warning "健康检查失败"
        fi
        
        # 显示PM2状态
        if command -v pm2 &> /dev/null; then
            pm2 list | grep ai-chat-signaling || print_info "未使用 PM2 管理"
        fi
    else
        print_warning "❌ 服务器未运行 (端口: $PORT)"
    fi
}

# 显示日志
show_logs() {
    if command -v pm2 &> /dev/null && pm2 list | grep -q ai-chat-signaling; then
        print_info "显示 PM2 日志..."
        pm2 logs ai-chat-signaling --lines 50
    elif [ -f "logs/app.log" ]; then
        print_info "显示应用日志..."
        tail -f logs/app.log
    else
        print_warning "未找到日志文件"
    fi
}

# 主函数
main() {
    # 显示欢迎信息
    echo -e "${BLUE}"
    echo "=================================="
    echo "  AI角色语音聊天 - 信令服务器"
    echo "  WebRTC Signaling Server"
    echo "=================================="
    echo -e "${NC}"
    
    case "${1:-start}" in
        "start")
            check_node_version
            check_dependencies
            check_env_file
            check_port
            create_log_dir
            start_server ${2:-dev}
            ;;
        "stop")
            stop_server
            ;;
        "restart")
            restart_server ${2:-dev}
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "install")
            check_node_version
            check_dependencies
            check_env_file
            print_message "✅ 安装完成，运行 ./start.sh start 启动服务器"
            ;;
        "help"|"-h"|"--help")
            echo "用法: $0 [命令] [模式]"
            echo ""
            echo "命令："
            echo "  start [模式]  启动服务器 (默认: dev)"
            echo "  stop         停止服务器"
            echo "  restart [模式] 重启服务器"
            echo "  status       显示服务器状态"
            echo "  logs         显示日志"
            echo "  install      安装依赖和配置"
            echo "  help         显示帮助信息"
            echo ""
            echo "启动模式："
            echo "  dev          开发模式 (自动重启)"
            echo "  prod         生产模式"
            echo "  pm2          PM2 进程管理"
            echo "  docker       Docker 容器"
            echo ""
            echo "示例："
            echo "  $0 start dev     # 开发模式启动"
            echo "  $0 start prod    # 生产模式启动"
            echo "  $0 start pm2     # PM2 模式启动"
            echo "  $0 restart prod  # 生产模式重启"
            echo "  $0 status        # 查看状态"
            echo "  $0 logs          # 查看日志"
            ;;
        *)
            print_error "未知命令: $1"
            print_info "运行 $0 help 查看帮助信息"
            exit 1
            ;;
    esac
}

# 捕获退出信号
trap 'print_warning "收到退出信号，正在清理..."; exit 0' INT TERM

# 执行主函数
main "$@"
