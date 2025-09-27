FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制代码
COPY embedding.py .

# 安装依赖
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple \
    flask \
    torch \
    sentence-transformers
# 暴露端口
EXPOSE 5000

# 启动服务
CMD ["python", "embedding.py"]