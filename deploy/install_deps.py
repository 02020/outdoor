import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=180):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:500])
    if err: print('[ERR]', err[:300])
    return out

# 1. 切换阿里云 npm 镜像
print('=== 切换阿里云 npm 镜像 ===')
run('npm config set registry https://registry.npmmirror.com')
run('npm config get registry')

# 2. 安装生产依赖
print('\n=== 安装 server 依赖 ===')
run('cd /opt/outdoor-fund/server && npm install --omit=dev 2>&1 | tail -8', timeout=300)

# 3. 验证依赖安装
print('\n=== 验证 node_modules ===')
run('ls /opt/outdoor-fund/server/node_modules | wc -l')
run('ls /opt/outdoor-fund/server/node_modules/express 2>/dev/null && echo "express OK" || echo "express MISSING"')
run('ls /opt/outdoor-fund/server/node_modules/better-sqlite3 2>/dev/null && echo "sqlite3 OK" || echo "sqlite3 MISSING"')

print('\nDeps install done!')
c.close()
