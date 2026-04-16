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
    print(f'>>> {cmd[:80]}')
    if out: print(out[:600])
    if err: print('[ERR]', err[:300])
    return out

# 查看 nginx 配置目录
print('=== Nginx 信息 ===')
run('nginx -v 2>&1')
run('ls /etc/nginx/conf.d/')
run('cat /etc/nginx/nginx.conf | head -20')

# 写入 outdoor-fund 的 nginx 配置
nginx_conf = '''server {
    listen 80;
    server_name _;

    # 前端静态文件
    root /opt/outdoor-fund/client;
    index index.html;

    # 前端 SPA：所有非 API 请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到 Node.js 后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
'''

print('\n=== 写入 Nginx 配置 ===')
stdin, _, _ = c.exec_command('cat > /etc/nginx/conf.d/outdoor-fund.conf')
stdin.write(nginx_conf)
stdin.channel.shutdown_write()
print('  config written')

# 备份并移除可能冲突的默认配置
run('ls /etc/nginx/conf.d/')
run('mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || echo "no default.conf"')

# 测试并重载
print('\n=== 测试 Nginx 配置 ===')
run('nginx -t 2>&1')

print('\n=== 重载 Nginx ===')
run('nginx -s reload 2>&1 || systemctl reload nginx 2>&1')

print('\n=== 验证 ===')
run('curl -s http://localhost/api/health')
run('curl -si http://localhost/ | head -5')

print('\nNginx done!')
c.close()
