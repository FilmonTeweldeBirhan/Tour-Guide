/* eslint-disable */

import { showAlert } from './alerts';
/* @APIUrl(link)  will be mounted to the protocol */
import { APIUrl } from './../../utils/apiurl';

export const updateUserDate = async (name, email) => {
  try {
    const res = await fetch(APIUrl('/api/v1/users/updateMe'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
      }),
    });

    const resJson = await res.json();
    // console.log(resJson);

    if (res.ok) {
      showAlert('success', 'Updated successfully.');
      window.setTimeout(() => {
        // location.assign('/me');
        location.reload(true);
      }, 1000);
    } else {
      throw resJson;
    }
  } catch (err) {
    showAlert('error', err.message);
    // console.log('Error:', err.message);
  }
};

export const updatePassword = async (currPwd, newPwd, newpwdRepeat) => {
  try {
    const res = await fetch(APIUrl('/api/v1/users/updateMyPassword'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: currPwd,
        newPassword: newPwd,
        newPasswordConfirm: newpwdRepeat,
      }),
    });

    const resJson = await res.json();
    // console.log(resJson);

    if (res.ok) {
      showAlert('success', 'Password updated!');
      //   window.setTimeout(() => {
      //     location.reload(true);
      //   }, 1000);
    } else {
      throw resJson;
    }
  } catch (error) {
    showAlert('error', error.message);
    // console.log('Error:', error.message);
  }
};
