async function handleLogin(email, password){
    const response = await fetch('/api/auth/login', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json'}, 
        body: JSON.stringify({email, password})
    });

    if( response.ok){
        const data = await response.json();
        console.log('Logged in as: ', data.name);
        window.location.reload();
    }
    else{
        alert("Invalid email or password.");
    }
}