"""Tests sur un serveur de test lancé et une base dédiée, sans suppression de données.
WEIGHTATY_TEST_URL requis. Chaque exécution crée des comptes uniques.
"""
import os, json, urllib.request, urllib.error, http.cookiejar, uuid, concurrent.futures
BASE=os.environ['WEIGHTATY_TEST_URL']
count=0
class Client:
    def __init__(self):
        self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.csrf='';self.csrf=self.get('session')['csrf'];assert self.get('session')['csrf']==self.csrf, 'Session non persistante'
    def call(self, op, data=None, status=200, csrf=True):
        global count
        headers={'Content-Type':'application/json'}
        if csrf: headers['X-CSRF-Token']=self.csrf
        req=urllib.request.Request(BASE+'/backend/api/index.php?op='+op, data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try:
            with self.opener.open(req) as r: code=r.status; result=json.load(r)
        except urllib.error.HTTPError as r: code=r.code;result=json.load(r)
        assert code==status,(op,code,status,result)
        count+=1
        return result
    def get(self,op,status=200):return self.call(op,status=status)
    def post(self,op,data,status=200,csrf=True):return self.call(op,data,status,csrf)
    def login(self,email,password='Test-valid-2026!'):
        result=self.post('login',{'email':email,'password':password});self.csrf=result['csrf'];return result['user']
def suite():
    suffix=uuid.uuid4().hex[:10];a,b,c=Client(),Client(),Client();emails=[];ids=[]
    for index,client in enumerate([a,b,c]):
        email=f'test-{suffix}-{index}@example.test';emails.append(email)
        ids.append(client.post('register',{'firstName':'Test','lastName':str(index),'email':email,'password':'Test-valid-2026!'})['id'])
        client.login(email)
    a.post('register',{'firstName':'Test','lastName':'Dup','email':emails[0],'password':'Test-valid-2026!'},409)
    a.post('profile',{'firstName':'Nouveau'});assert a.get('user')['firstName']=='Nouveau'
    assert 'email' not in b.get('user&id='+ids[0])
    a.get('admin',403);a.post('profile',{'firstName':'CSRF'},403,False)
    visitor=Client();visitor.get('myTrips',401)
    t=a.post('saveTrip',{'from':'Paris','to':'Montréal','date':'2099-04-20','capacity':8,'pickup':'Paris','delivery':'Montréal','notes':'Test'})
    assert len(a.get('trips&from=Paris&to=Montr%C3%A9al'))>=1
    a.post('saveTrip',{'from':'Paris','to':'Paris','date':'2099-04-20','capacity':8,'pickup':'Paris','delivery':'Paris'},422)
    a.post('saveTrip',{'from':'Paris','to':'Lyon','date':'2020-01-01','capacity':8,'pickup':'Paris','delivery':'Lyon'},422)
    a.post('saveTrip',{'from':'Paris','to':'Lyon','date':'2099-02-31','capacity':8,'pickup':'Paris','delivery':'Lyon'},422)
    b.post('cancelTrip',{'id':t['id']},403)
    def parcel(client,weight=5,photo=''):
        return client.post('saveDraft',{'tripId':t['id'],'type':'Documents','description':'Test <script>alert(1)</script>','weight':weight,'value':0,'length':20,'width':10,'height':5,'photo':photo})
    b.post('saveDraft',{'tripId':t['id'],'type':'Documents','description':'T','weight':9,'value':0,'length':20,'width':10,'height':5},409)
    p1=parcel(b);p2=parcel(c)
    assert b.get('draft')['id']==p1['id']
    assert a.get('parcel&id='+p1['id']) is None
    r1=b.post('sendRequest',{'parcelId':p1['id']});r2=c.post('sendRequest',{'parcelId':p2['id']})
    assert b.post('sendRequest',{'parcelId':p1['id']})['id']==r1['id']
    assert len(a.get('requests&incoming=1'))==2
    c.get('request&id='+r1['id'],403)
    b.post('updateRequest',{'id':r1['id'],'status':'Acceptée'},403)
    # Deux sessions du même voyageur : les requêtes ne sont pas sérialisées par le verrou PHP de session.
    a2=Client();a2.login(emails[0])
    def accept(pair):
        client,r=pair
        try: return client.post('updateRequest',{'id':r['id'],'status':'Acceptée'},200)
        except AssertionError as exc:
            if "409" in str(exc) and 'Capacité' in str(exc):return None
            raise
    with concurrent.futures.ThreadPoolExecutor() as pool:results=list(pool.map(accept,[(a,r1),(a2,r2)]))
    assert sum(x is not None for x in results)==1,results
    assert a.get('trip&id='+t['id'])['capacity']==3
    winner = (b,r1,p1) if results[0] else (c,r2,p2)
    loser=(c,r2,p2) if results[0] else (b,r1,p1)
    sender,r,p=winner
    sender.post('review',{'id':r['id'],'note':5,'comment':'T'},409)
    a.post('pickup',{'id':r['id']},409)
    sender.post('message',{'id':r['id'],'content':'Bonjour <script>test</script>'})
    assert a.get('transport&id='+r['id'])['messages'][0]['contenu']=='Bonjour <script>test</script>'
    sender.post('pay',{'id':r['id']});sender.post('pay',{'id':r['id']})
    assert sender.get('transport&id='+r['id'])['payment']['mode']=='simulation'
    # Une annulation après prise en charge sera refusée ci-dessous.
    a.post('pickup',{'id':r['id']});sender.post('updateRequest',{'id':r['id'],'status':'Annulée'},409);a.post('cancelTrip',{'id':t['id']},409)
    a.post('deliver',{'id':r['id']},403);sender.post('deliver',{'id':r['id']})
    sender.post('review',{'id':r['id'],'note':5,'comment':'Livré'})
    sender.post('review',{'id':r['id'],'note':5,'comment':'Doublon'},409)
    a.post('review',{'id':r['id'],'note':6,'comment':'Non'},422)
    sender.post('report',{'id':r['id'],'reason':'Test de signalement'})
    loser[0].post('updateRequest',{'id':loser[1]['id'],'status':'Annulée'})
    assert len(a.get('notifications'))>0
    a.post('readNotifications',{});assert all(n['read'] for n in a.get('notifications'))
    a.post('logout',{});a.get('myTrips',401)
    # Contrôle de la limite de tentatives, sans dépendre de mots de passe dans le dépôt.
    v=Client()
    for _ in range(10):v.post('login',{'email':'bad-'+suffix+'@example.test','password':'incorrect'},401)
    v.post('login',{'email':'bad-'+suffix+'@example.test','password':'incorrect'},429)
    print(f'{count} requêtes API vérifiées ; concurrence, droits, CSRF et parcours livraison validés.')
    return {'emails':emails,'ids':ids,'password':'Test-valid-2026!','request':r['id']}
if __name__=='__main__':suite()
