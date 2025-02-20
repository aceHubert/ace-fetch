'use client';
import { useState, useEffect } from 'react';
import { getActiveFetch } from '@ace-fetch/react';
import { useUserApi, User } from '../apis/useUserApi';

export default function Page() {
  const userApi = useUserApi();

  const fetch = getActiveFetch();
  const [user, setUser] = useState<User>();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<Partial<Omit<User, 'id'>>>({});
  const [loading, setLoading] = useState(false);

  const getUsers = () => {
    userApi.getUsers().then(({ data }) => {
      setUsers(data);
    });
  };

  const getUser = (id: number) => {
    userApi.getUser({ params: { id } }).then(({ data }) => {
      setUser(data);
    });
  };

  const delUser = (id: number) => {
    fetch!.client.delete<boolean>(`http://localhost:7009/user/${id}`).then(({ data }) => {
      if (data) {
        getUsers();
      }
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  const addUser = () => {
    Object.values(newUser).some((item) => !!item) &&
      userApi
        .addUser({
          data: newUser,
          loading: (value) => {
            setLoading(value);
          },
        })
        .then(({ data }) => {
          setUser(data);
          getUsers();
        })
        .finally(() => {
          setNewUser({});
        });
  };

  return (
    <div>
      <h1>axios provider(React):</h1>
      <div>
        FirstName:
        <input
          type="text"
          value={newUser.firstName}
          onInput={(event: any) => (newUser.firstName = event.target.value)}
        ></input>
        LastName:
        <input
          type="text"
          value={newUser.lastName}
          onInput={(event: any) => (newUser.lastName = event.target.value)}
        ></input>
        City:
        <input type="text" value={newUser.city} onInput={(event: any) => (newUser.city = event.target.value)}></input>
        <input type="button" value="Add" disabled={loading} onClick={() => addUser()}></input>
      </div>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{[user.firstName, user.lastName].join(' ')}</td>
              <td>
                <a
                  href="javascript:;"
                  data-id={user.id}
                  onClick={(event) => {
                    event.preventDefault();
                    getUser(user.id);
                  }}
                >
                  View
                </a>
                &nbsp;
                <a
                  href="javascript:;"
                  data-id={user.id}
                  onClick={(event) => {
                    event.preventDefault();
                    delUser(user.id);
                  }}
                >
                  Remove
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <pre>
        <code>{user && JSON.stringify(user, null, 2)}</code>
      </pre>
    </div>
  );
}
