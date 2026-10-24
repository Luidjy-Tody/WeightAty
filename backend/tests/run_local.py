import subprocess,os,time,sys,json,importlib.util,socket
from pathlib import Path
import tempfile
repo=Path(__file__).resolve().parents[2];root=Path(tempfile.mkdtemp(prefix='weightaty-tests-'));runtime=Path(os.environ.get('MYSQL_BASEDIR','/usr'));php=os.environ.get('PHP_BIN','php')
(root/'outbox').mkdir();(root/'uploads').mkdir()
env=os.environ.copy();env['LD_LIBRARY_PATH']=str(runtime/'lib/x86_64-linux-gnu')
env.update(DB_DSN='mysql:host=127.0.0.1;port=3307;dbname=weightaty_db;charset=utf8mb4',DB_USER='root',MAIL_OUTBOX=str(root/'outbox'),UPLOAD_DIR=str(root/'uploads'),APP_URL='http://127.0.0.1:8001',PHP_CLI_SERVER_WORKERS='4',WEIGHTATY_TEST_URL='http://127.0.0.1:8001')
db_log=open(root/'db-test.log','w');php_log=open(root/'php-test.log','w')
import tempfile
datadir=Path(tempfile.mkdtemp(prefix='wat-db-',dir=root))
subprocess.run([str(runtime/'bin/mariadb-install-db'),'--no-defaults','--basedir='+str(runtime),'--datadir='+str(datadir),'--auth-root-authentication-method=normal','--skip-test-db'],env=env,check=True,stdout=db_log,stderr=db_log)
(root/'sessions').mkdir(exist_ok=True)
env['SESSION_DIR']=str(root/'sessions')
env['WEIGHTATY_TEST_ADMIN_EMAIL']=''

procs=[]
try:
 procs.append(subprocess.Popen([os.environ.get('MYSQL_SERVER_BIN',str(runtime/'sbin/mariadbd')),'--no-defaults','--user='+__import__('getpass').getuser(),'--basedir='+str(runtime),'--datadir='+str(datadir),'--socket=','--pid-file='+str(root/'mysql.pid'),'--bind-address=127.0.0.1','--port=3307'],env=env,stdout=db_log,stderr=db_log,start_new_session=True))
 for _ in range(100):
  try:s=socket.create_connection(('127.0.0.1',3307),.2);s.close();break
  except OSError:time.sleep(.1)
 # PDO CLI applique les scripts, sans dépendre du client mysql non bloquant.
 for script in ['database/01_creation_weightaty_securisee.sql','database/migrations/04_finalisation.sql','database/migrations/04_finalisation.sql','database/migrations/05_validation_paiement.sql','database/migrations/05_validation_paiement.sql']:
  subprocess.run([php,'-r',"require 'backend/config/database.php'; db()->exec(file_get_contents($argv[1]));",script],cwd=repo,env={**env,'DB_DSN':env['DB_DSN'].replace('dbname=weightaty_db;','')},check=True)
 procs.append(subprocess.Popen([php,'-S','127.0.0.1:8001','backend/router.php'],cwd=repo,env=env,stdout=php_log,stderr=php_log,start_new_session=True))
 time.sleep(.5)
 os.environ.update(env)
 spec=importlib.util.spec_from_file_location('integration',repo/'backend/tests/integration.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 result=mod.suite();None
 # Préparer un administrateur seulement dans la base de test.
 subprocess.run([php,'-r',"require 'backend/config/database.php'; db()->prepare('INSERT IGNORE INTO administrateur VALUES (?)')->execute([$argv[1]]);",result['ids'][0]],cwd=repo,env=env,check=True)

 spec2=importlib.util.spec_from_file_location('admin_reset',repo/'backend/tests/admin_reset.py');extra=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(extra);extra.verify(mod,result,root/'outbox')
 spec3=importlib.util.spec_from_file_location('photo_refund',repo/'backend/tests/photo_refund.py');photos=importlib.util.module_from_spec(spec3);spec3.loader.exec_module(photos);photos.verify(mod)
 print(str(mod.count)+' requêtes API vérifiées après les tests complémentaires.')
 if len(sys.argv)>1:subprocess.run(sys.argv[1:],cwd=repo,env=env,check=True)
finally:
 import signal
 for p in reversed(procs):
  try:os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=10)
  except (ProcessLookupError,subprocess.TimeoutExpired):pass
 print('Journaux de test : '+str(root))
