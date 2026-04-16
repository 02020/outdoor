import paramiko

HOST = '223.6.248.243'
USER = 'root'
PASS = 'LZal33547840'
DB_PATH = '/opt/outdoor-fund/data/outdoor.db'

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

# 1. 检查 sqlite3 是否可用
run('which sqlite3 || yum install -y sqlite 2>&1 | tail -3')

# 2. 执行 migration SQL
print('=== 执行数据库迁移 ===')
# 上传 SQL 文件
sftp.put(r'd:\P00\Superpowers\outdoor-fund\server\src\db\migrations\0000_hard_bruce_banner.sql', '/tmp/m0000.sql')
sftp.put(r'd:\P00\Superpowers\outdoor-fund\server\src\db\migrations\0001_useful_hercules.sql', '/tmp/m0001.sql')

# 执行 SQL（把 --> statement-breakpoint 替换掉）
run(f"sed 's/--> statement-breakpoint/;/g' /tmp/m0000.sql | sqlite3 {DB_PATH} 2>&1")
run(f"sed 's/--> statement-breakpoint/;/g' /tmp/m0001.sql | sqlite3 {DB_PATH} 2>&1")

# 3. 验证表创建
run(f"sqlite3 {DB_PATH} '.tables'")

# 4. 调 API 创建默认群组
print('\n=== 创建默认群组 [猹瓜瞒] ===')
import time; time.sleep(1)
result = run("""curl -s -X POST http://localhost:3000/api/auth/groups \
  -H 'Content-Type: application/json' \
  -d '{"name":"猹瓜瞒","adminPassword":"caguaddie2024","memberPassword":"outdoor2024","description":"猹瓜瞒户外公积金"}' """)
print('Result:', result)

# 5. 确认群组列表
print('\n=== 群组列表 ===')
run('curl -s http://localhost:3000/api/auth/groups')

print('\nDone!')
sftp.close()
c.close()
