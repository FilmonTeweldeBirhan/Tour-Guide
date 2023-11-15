/* eslint-disable */
import '@babel/polyfill';
import { dispalyMap } from './mapbox';
import { login, logout } from './login';
import { updateUserDate, updatePassword } from './updateSettings';

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const loginForm = document.querySelector('#formLogin');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataBtn = document.querySelector('#submitUserData');
const updatePwdBtn = document.querySelector('#updatePwd');

/* DELEGATIONS */
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  // console.log(locations);
  dispalyMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (ev) => {
    // preventDefault so that it won't reload the page!
    ev.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    // console.log(email, password);
    login(email, password);
  });
}

if (userDataBtn) {
  userDataBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    // console.log('im here');
    updateUserDate(name, email);
  });
}

if (updatePwdBtn) {
  updatePwdBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const password = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const newPasswordConfirm =
      document.querySelector('#password-confirm').value;

    // sending the passwords to be updated in the login.js
    updatePassword(password, newPassword, newPasswordConfirm);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
