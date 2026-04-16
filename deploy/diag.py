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
    if out: print(out[:800])
    if err: print('[ERR]', err[:400])
    return out

# 确认根目录 node_modules 有东西
print('=== 根目录 node_modules ===')
run('ls /opt/outdoor-fund/node_modules | wc -l')
run('ls /opt/outdoor-fund/node_modules/express 2>/dev/null && echo "express OK" || echo "MISSING"')
run('ls /opt/outdoor-fund/node_modules/better-sqlite3 2>/dev/null && echo "sqlite3 OK" || echo "MISSING"')
run('ls /opt/outdoor-fund/node_modules/@outdoor-fund 2>/dev/null && echo "shared OK" || echo "MISSING"')

# 检查实际的入口文件
print('\n=== 检查编译产物入口 ===')
run('cat /opt/outdoor-fund/server/dist/server/src/index.js | head -5')

# 测试能不能直接跑（workspace 模式，从根目录运行）
print('\n=== 试运行 server（后台 3 秒后 kill）===')
run('cd /opt/outdoor-fund && node server/dist/server/src/index.js &\nsleep 3\ncurl -s http://localhost:3000/api/health || echo "no response"\nkill %1 2>/dev/null\ntrue')

print('\nDiag done!')
c.close()
