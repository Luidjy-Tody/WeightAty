"""Contrôles supplémentaires après attribution locale du rôle administrateur de test."""
import json
from pathlib import Path

def verify(mod, result, outbox):
    admin=mod.Client();admin.login(result['emails'][0])
    snapshot=admin.get('admin');assert int(snapshot['stats']['utilisateurs'])>=3
    assert 'signalements_ouverts' in snapshot['stats'] and 'paiements_en_attente' in snapshot['stats'] and all('prenom' in x and 'depart' in x for x in snapshot['reports'])
    opened=[x for x in snapshot['reports'] if x['statut']=='ouvert']
    assert opened
    admin.post('adminAction',{'action':'resolve','id':opened[0]['id']});admin.post('adminAction',{'action':'resolve','id':opened[0]['id']},409)
    old=mod.Client();old.login(result['emails'][1])
    admin.post('adminAction',{'action':'suspend','id':result['ids'][1]})
    old.get('myTrips',401)
    suspended=mod.Client();suspended.post('login',{'email':result['emails'][1],'password':result['password']},401)
    admin.post('adminAction',{'action':'activate','id':result['ids'][1]})
    sender=mod.Client();sender.login(result['emails'][1]);sender.post('forgot',{'email':result['emails'][1]})
    token=None
    for file in Path(outbox).glob('*.json'):
        letter=json.loads(file.read_text())
        if letter['to']==result['emails'][1]:token=letter['resetUrl'].split('token=')[1]
    assert token
    visitor=mod.Client();visitor.post('reset',{'token':token,'password':'Changed-valid-2026!'})
    sender.get('myTrips',401)
    visitor.post('reset',{'token':token,'password':'Changed-again-2026!'},400)
    visitor.login(result['emails'][1],'Changed-valid-2026!')
    admin.get('admin')
    print(f'{mod.count} requêtes API vérifiées au total, avec administration et réinitialisation.')
