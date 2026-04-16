import paramiko
import os

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'
LOCAL_DIST = r'd:\P00\Superpowers\outdoor-fund\client\dist'
REMOTE_DIR = '/opt/outdoor-fund/client'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)
sftp = c.open_sftp()

def run(cmd, timeout=30):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:80]}')
    if out: print(out[:400])
    if err and 'Warning' not in err: print('[ERR]', err[:300])
    return out

def upload_dir(local, remote):
    try:
        sftp.stat(remote)
    except FileNotFoundError:
        sftp.mkdir(remote)
    for item in os.listdir(local):
        lpath = os.path.join(local, item)
        rpath = remote + '/' + item
        if os.path.isdir(lpath):
            upload_dir(lpath, rpath)
        else:
            sftp.put(lpath, rpath)

print('=== 清空旧前端 ===')
run(f'rm -rf {REMOTE_DIR}/* && rm -rf {REMOTE_DIR}/assets 2>/dev/null; true')

print('=== 上传新前端 ===')
upload_dir(LOCAL_DIST, REMOTE_DIR)

total = run(f'find {REMOTE_DIR} -type f | wc -l')
print(f'上传文件数: {total}')

# 检查 nginx 是否正常
print('\n=== 验证 ===')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost/')
run('curl -s http://localhost/api/health')

print('\nDone!')
sftp.close()
c.close()
