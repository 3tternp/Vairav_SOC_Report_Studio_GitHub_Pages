const query=location.search;
history.replaceState(null,'',location.pathname);
if(window.opener){window.opener.postMessage({type:'vairav-m365-callback',query},location.origin);document.getElementById('result').textContent='Sign-in returned to the advisory app. You can close this window.';window.close();}
else document.getElementById('result').textContent='Open Microsoft sign-in from the advisory app. This callback page cannot be used on its own.';
