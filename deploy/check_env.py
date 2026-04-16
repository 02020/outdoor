import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

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
    if out: print(out[:600])
    if err and 'Warning' not in err: print('[ERR]', err[:300])
    return out

# 检查 .env 位置和内容
run('ls -la /opt/outdoor-fund/server/')
run('cat /opt/outdoor-fund/server/.env 2>/dev/null || echo "NOT FOUND"')
run('cat /opt/outdoor-fund/.env 2>/dev/null || echo "NOT FOUND"')

# 看 pm2 ecosystem 文件
run('ls /opt/outdoor-fund/*.json 2>/dev/null || true')
run('ls /opt/outdoor-fund/ecosystem* 2>/dev/null || echo "no ecosystem"')

print('\nDone!')
sftp.close()
c.close()
