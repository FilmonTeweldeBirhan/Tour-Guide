/* eslint-disable */

import { showAlert } from './alerts';
/* @APIUrl(link)  will be mounted to the protocol */
import { APIUrl } from './../../utils/apiurl';

export const login = async (email, password) => {
  try {
    console.log(email, password);

    const res = await fetch(APIUrl('/api/v1/users/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const resJson = await res.json();

    if (res.ok) {
      showAlert('success', 'Loggin in!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    } else {
      throw resJson;
    }
  } catch (err) {
    showAlert('error', err.message);
    // console.log('Error:', err);
  }
};

export const logout = async () => {
  try {
    const res = await fetch(APIUrl('/api/v1/users/logout'));
    const resJson = await res.json();
    if (res.ok) {
      showAlert('success', resJson.message);
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (error) {
    showAlert('error', 'Error: error while logging out, Try again.');
  }
};
