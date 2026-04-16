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
    if out: print(out[:800])
    if err: print('[ERR]', err[:300])
    return out

# 查看完整 nginx.conf，找默认 server 块
print('=== 查看 nginx.conf 中的 server 块 ===')
run('cat /etc/nginx/nginx.conf')

print('\nDone!')
c.close()
