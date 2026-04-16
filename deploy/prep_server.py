import paramiko, sys

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=60):
    _, o, e = c.exec_command(cmd, timeout=timeout)
    o.channel.recv_exit_status()
    out = o.read().decode().strip()
    err = e.read().decode().strip()
    print(f'>>> {cmd[:70]}')
    if out: print(out)
    if err: print('[ERR]', err[:200])
    return out

run('npm install -g pm2 2>&1 | tail -5', timeout=120)
run('pm2 --version')
run('mkdir -p /opt/outdoor-fund/server/dist /opt/outdoor-fund/client /opt/outdoor-fund/data')
print('Server prep done!')
c.close()
