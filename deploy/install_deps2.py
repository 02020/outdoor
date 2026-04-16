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

# 查看服务器实际目录结构
print('=== 检查目录结构 ===')
run('ls /opt/outdoor-fund/')
run('cat /opt/outdoor-fund/server/package.json | head -20')
run('cat /opt/outdoor-fund/package.json')

# 问题：server 依赖 @outdoor-fund/shared，需要 workspace 支持
# 解决方案：修改 server/package.json 中的 shared 依赖，改为 file:../shared
print('\n=== 修改 shared 依赖为本地路径 ===')
run("""cd /opt/outdoor-fund/server && node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.dependencies['@outdoor-fund/shared'] = 'file:../shared';
// 删除 workspaces 相关
delete pkg.workspaces;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json updated');
" """)

run('cat /opt/outdoor-fund/server/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[\"dependencies\"][\"@outdoor-fund/shared\"])"')

# 现在安装
print('\n=== 重新安装依赖 ===')
run('cd /opt/outdoor-fund/server && npm install --omit=dev 2>&1 | tail -8', timeout=300)

# 验证
print('\n=== 验证 ===')
run('ls /opt/outdoor-fund/server/node_modules | wc -l')
run('ls /opt/outdoor-fund/server/node_modules/express 2>/dev/null && echo "express OK" || echo "MISSING"')
run('ls /opt/outdoor-fund/server/node_modules/better-sqlite3 2>/dev/null && echo "sqlite3 OK" || echo "MISSING"')
run('ls /opt/outdoor-fund/server/node_modules/@outdoor-fund 2>/dev/null && echo "shared OK" || echo "MISSING"')

print('\nDone!')
c.close()
