import paramiko
import os

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'
BASE = r'd:\P00\Superpowers\outdoor-fund'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)
sftp = c.open_sftp()

def run(cmd, timeout=60):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:600])
    if err: print('[ERR]', err[:300])
    return out

def upload_dir(local_dir, remote_dir):
    run(f'mkdir -p {remote_dir}')
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isdir(local_path):
            upload_dir(local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)

# 1. 上传 server/dist/shared/src/*.js 到 /opt/outdoor-fund/shared/dist/
#    (这是 tsc 编译后 shared 的 CJS 版)
print('=== 上传 shared 编译产物到 /opt/outdoor-fund/shared/dist/ ===')
shared_dist = os.path.join(BASE, 'server', 'dist', 'shared', 'src')
upload_dir(shared_dist, '/opt/outdoor-fund/shared/dist')
run('ls /opt/outdoor-fund/shared/dist/')

# 2. 修改 shared/package.json: 去掉 type:module, 指向 dist/index.js
print('\n=== 修改 shared/package.json ===')
run("""node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('/opt/outdoor-fund/shared/package.json','utf8'));
delete pkg.type;
pkg.main = './dist/index.js';
pkg.types = './dist/index.d.ts';
fs.writeFileSync('/opt/outdoor-fund/shared/package.json', JSON.stringify(pkg, null, 2));
console.log('updated');
" """)
run('cat /opt/outdoor-fund/shared/package.json')

# 3. 测试启动
print('\n=== 测试启动 server ===')
run("""bash -c 'cd /opt/outdoor-fund && node server/dist/server/src/index.js > /tmp/server.log 2>&1 &
sleep 4
curl -s http://localhost:3000/api/health
kill %1 2>/dev/null
cat /tmp/server.log | tail -5'""", timeout=20)

print('\nDone!')
sftp.close()
c.close()
