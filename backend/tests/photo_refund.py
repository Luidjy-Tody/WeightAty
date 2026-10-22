"""Photos privées, refus, modification et remboursement simulé avant prise en charge."""
import base64,urllib.request,urllib.error,uuid

def verify(mod):
    a,b,c=mod.Client(),mod.Client(),mod.Client()
    for i,client in enumerate([a,b,c]):
        email=f'photo-{uuid.uuid4().hex}-{i}@example.test'
        client.post('register',{'firstName':'Photo','lastName':str(i),'email':email,'password':'Test-valid-2026!'})
        client.login(email)
    t=a.post('saveTrip',{'from':'Lyon','to':'Maurice','date':'2099-05-01','capacity':8,'pickup':'Lyon','delivery':'Maurice'})
    data={'tripId':t['id'],'type':'Documents','description':'Photo','weight':2,'value':100,'length':20,'width':10,'height':5}
    png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII='
    p=b.post('saveDraft',{**data,'photo':png});assert p['photo'].startswith('/backend/photo.php?file=')
    with b.opener.open(mod.BASE+p['photo']) as response:assert response.headers.get_content_type()=='image/png'
    try:c.opener.open(mod.BASE+p['photo']);raise AssertionError('Photo publique')
    except urllib.error.HTTPError as error:assert error.code==403
    b.post('saveDraft',{**data,'id':p['id'],'photo':'data:image/png;base64,'+base64.b64encode(b'not an image').decode()},422)
    r=b.post('sendRequest',{'parcelId':p['id']})
    with a.opener.open(mod.BASE+p['photo']) as response:assert response.status==200
    b.post('saveDraft',{**data,'id':p['id'],'photo':png},409)
    a.post('updateRequest',{'id':r['id'],'status':'Acceptée'})
    b.post('pay',{'id':r['id']})
    b.post('updateRequest',{'id':r['id'],'status':'Annulée'})
    assert a.get('trip&id='+t['id'])['capacity']==8
    assert b.get('transport&id='+r['id'])['refund'] is not None
    t2=a.post('saveTrip',{'from':'Lyon','to':'Paris','date':'2099-05-01','capacity':8,'pickup':'Lyon','delivery':'Paris'})
    b.post('saveDraft',{**data,'id':p['id'],'tripId':t2['id'],'photo':png})
    r2=b.post('sendRequest',{'parcelId':p['id']})
    a.post('updateRequest',{'id':r2['id'],'status':'Refusée'})
    assert b.get('request&id='+r2['id'])['status']=='Refusée'
    print('Photos privées, refus, réutilisation du colis et remboursement simulé validés.')
