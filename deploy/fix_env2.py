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

# 直接把环境变量写入 ecosystem，不依赖 env_file
ecosystem = '''module.exports = {
  apps: [{
    name: 'outdoor-fund',
    script: '/opt/outdoor-fund/server/dist/server/src/index.js',
    cwd: '/opt/outdoor-fund/server',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_PATH: '/opt/outdoor-fund/data/outdoor.db',
      JWT_SECRET: '294b3bc3ddf84c0f3584b3f806009c00ae38d554b63932cbfdc2600a0f0288e1'
    }
  }]
}
'''

with sftp.open('/opt/outdoor-fund/ecosystem.config.cjs', 'w') as f:
    f.write(ecosystem)
print('写入 ecosystem.config.cjs OK')

# 重启
run('pm2 restart outdoor-fund --update-env')

import time
time.sleep(3)

# 验证登录
print('\n=== 验证登录 ===')
r = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"outdoor2024"}' """)
print('Login result:', r[:300])

# 测试管理员密码
r2 = run("""curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"groupId":1,"password":"caguaddie2024"}' """)
print('Admin login:', r2[:200])

run('pm2 save')
print('\nDone!')
sftp.close()
c.close()
