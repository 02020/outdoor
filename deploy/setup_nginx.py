import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:100]}')
    if out: print(out[:500])
    if err: print('[ERR]', err[:300])
    return out

# 1. 配置 Nginx
print('=== 配置 Nginx ===')
nginx_conf = """server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /opt/outdoor-fund/client;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
"""

# 写入 Nginx 配置
sftp = c.open_sftp()
with sftp.open('/etc/nginx/conf.d/outdoor-fund.conf', 'w') as f:
    f.write(nginx_conf)
print('Nginx config written')

# 2. 测试并重载 Nginx
print('\n=== 测试 Nginx 配置 ===')
run('nginx -t')

print('\n=== 重载 Nginx ===')
run('nginx -s reload')

# 3. 测试访问
import time
time.sleep(2)

print('\n=== 测试 HTTP 访问 ===')
run('curl -s http://223.6.248.243/api/auth/groups | head -c 300')

sftp.close()
c.close()
print('\n=== Nginx 配置完成 ===')
