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

# 写 ecosystem.config.cjs（pm2 需要 .cjs 因为根 package.json 可能有 type:module）
ecosystem = '''module.exports = {
  apps: [{
    name: 'outdoor-fund',
    script: '/opt/outdoor-fund/server/dist/server/src/index.js',
    cwd: '/opt/outdoor-fund/server',
    env_file: '/opt/outdoor-fund/server/.env',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
'''

with sftp.open('/opt/outdoor-fund/ecosystem.config.cjs', 'w') as f:
    f.write(ecosystem)
print('写入 ecosystem.config.cjs OK')

# 重启 PM2 with ecosystem
run('pm2 delete outdoor-fund 2>/dev/null; true')
run('cd /opt/outdoor-fund && pm2 start ecosystem.config.cjs')
run('pm2 status')

import time
time.sleep(3)

# 验证
print('\n=== 验证 ===')
run('curl -s http://localhost:3000/api/health')
r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Login result:', r[:200])

run('pm2 save')

print('\nDone!')
sftp.close()
c.close()
