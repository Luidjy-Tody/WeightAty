/* CLIENT POUR LES FUTURES API */
WAT.config = {mode:'mock',apiBaseUrl:''};
WAT.api = async function(path,{method='GET',body,signal}={}) {
  const response = await fetch(WAT.config.apiBaseUrl + path,{
    method,credentials:'include',signal,
    headers: body === undefined ? {'Accept':'application/json'} : {'Accept':'application/json','Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  if (!response.ok) {
    let error; try {error=await response.json();} catch {error={};}
    throw new Error(error.message || `La requête a échoué (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
};
