// tabLogin, tabRegister, formLogin, formRegister, authMessage, themeToggle
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginSubmit = document.getElementById('login-submit');
const formLogin = document.getElementById('form-login');
const registerSubmit = document.getElementById('reg-submit');
const formRegister = document.getElementById('form-register');
const authMessage = document.getElementById('auth-message');
const themeToggle = document.getElementById('theme-toggle');

function setAuthTab(tab){
    if( tab === 'login'){
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
    }
    else{
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
    }
    authMessage.textContent = '';
    authMessage.classList.add('hidden');
}

function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studypulse_theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

const savedTheme = localStorage.getItem('studypulse_theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
});

tabLogin.addEventListener('click', () => setAuthTab('login'));
tabRegister.addEventListener('click', () => setAuthTab('register'));

function showMessage(text, type = 'error') {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
}

async function getErrorMessage(response){
    try{
        const err = await response.json();
        if( typeof err.detail === 'string'){
            return err.detail;
        }
        if( Array.isArray(err.detail) && err.detail.length > 0){
            return err.detail[0].msg;
        }
    }
    catch(_){}
    return `Request failed with HTTP ${response.status}`;
}

formLogin.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    handleLogin(email, password);
});

async function handleLogin(email, password){
    loginSubmit.disabled = true;

    try{
        const response = await fetch('/api/auth/login', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json'}, 
            body: JSON.stringify({email, password})
        });

        if( response.ok){
            // const data = await response.json();
            // console.log('Logged in as: ', data.name);
            window.location.href = '/';
        }
        else{
            const msg = await getErrorMessage(response);
            showMessage(msg, 'error');
        }
    }
    catch(err){
        showMessage('Network error. Please try again later.', 'error');
    }
    finally{
        loginSubmit.disabled = false;
    }
}

formRegister.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const rawYear = document.getElementById('reg-year').value.trim();
    const year_of_study = rawYear ? Number(rawYear) : null;
    const university = document.getElementById('reg-uni').value.trim() || null;

    handleRegister(name, email, password, university, year_of_study);
});

async function handleRegister(name, email, password, university, year_of_study){
    registerSubmit.disabled = true;

    try{
        const response = await fetch('/api/auth/register', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json'}, 
            body: JSON.stringify({name, email, password, university, year_of_study})
        });

        if( response.ok){
            await handleLogin(email, password);
        }
        else{
            const msg = await getErrorMessage(response);
            showMessage(msg, 'error');
        }
    }
    catch(err){
        showMessage('Network error. Please try again later.', 'error');
    }
    finally{
        registerSubmit.disabled = false;
    }
}

async function checkSession(){
    try{
        const response = await fetch('/api/auth/me');
        if(  response.ok){
            window.location.href = '/';
        }
    }
    catch(_){}
}
checkSession();