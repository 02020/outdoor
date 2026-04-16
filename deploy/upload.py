import paramiko
import os
import stat

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
    print(f'>>> {cmd[:70]}')
    if out: print(out[:300])
    if err: print('[ERR]', err[:200])
    return out

def upload_dir(local_dir, remote_dir):
    """递归上传目录"""
    run(f'mkdir -p {remote_dir}')
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        if os.path.isdir(local_path):
            upload_dir(local_path, remote_path)
        else:
            print(f'  upload: {local_path} -> {remote_path}')
            sftp.put(local_path, remote_path)

# 1. 上传 server/dist
print('\n=== 上传 server/dist ===')
upload_dir(os.path.join(BASE, 'server', 'dist'), '/opt/outdoor-fund/server/dist')

# 2. 上传 server/package.json (生产依赖需要)
print('\n=== 上传 server/package.json ===')
sftp.put(os.path.join(BASE, 'server', 'package.json'), '/opt/outdoor-fund/server/package.json')

# 3. 上传 shared 源码 (server 依赖)
print('\n=== 上传 shared ===')
upload_dir(os.path.join(BASE, 'shared', 'src'), '/opt/outdoor-fund/shared/src')
sftp.put(os.path.join(BASE, 'shared', 'package.json'), '/opt/outdoor-fund/shared/package.json')

# 4. 上传 client/dist (前端静态文件)
print('\n=== 上传 client/dist ===')
upload_dir(os.path.join(BASE, 'client', 'dist'), '/opt/outdoor-fund/client')

# 5. 上传根 package.json
print('\n=== 上传根 package.json ===')
sftp.put(os.path.join(BASE, 'package.json'), '/opt/outdoor-fund/package.json')

# 6. 上传 tsconfig.base.json
tsconfig = os.path.join(BASE, 'tsconfig.base.json')
if os.path.exists(tsconfig):
    sftp.put(tsconfig, '/opt/outdoor-fund/tsconfig.base.json')

print('\n=== 文件上传完成 ===')
sftp.close()
c.close()
