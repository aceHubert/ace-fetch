import { defineComponent, ref, unref, onMounted } from 'vue-demi';
import { userApi, User } from '../apis/index';

export default defineComponent({
  name: 'Playground',

  setup() {
    const userRef = ref<User | null>(null);
    const usersRef = ref<User[]>([]);
    const newUserRef = ref<Partial<Omit<User, 'id'>>>({});

    const getUsers = () => {
      userApi.getUsers().then(({ data }) => {
        usersRef.value = data;
      });
    };

    const getUser = (id: number) => {
      userApi.getUser({ params: { id } }).then(({ data }) => {
        userRef.value = data;
      });
    };

    const addUser = () => {
      Object.values(newUserRef.value).some((item) => !!item) &&
        userApi
          .addUser({
            data: newUserRef.value,
          })
          .then(({ data }) => {
            userRef.value = data;
            getUsers();
          })
          .finally(() => {
            newUserRef.value = {};
          });
    };

    const delUser = (id: number) => {
      userApi.delUser({ params: { id } }).then(() => {
        getUsers();
      });
    };

    onMounted(() => {
      getUsers();
    });

    return () => {
      const users = unref(usersRef);
      const user = unref(userRef);
      const newUser = unref(newUserRef);
      return (
        <div>
          <h1>axios provider:</h1>
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
            <input
              type="text"
              value={newUser.city}
              onInput={(event: any) => (newUser.city = event.target.value)}
            ></input>
            <input type="button" value="Add" onClick={() => addUser()}></input>
          </div>
          <table>
            <th>
              <td>id</td>
              <td>name</td>
              <td></td>
            </th>
            {users.map((user) => (
              <tr>
                <td>{user.id}</td>
                <td>{[user.firstName, user.lastName].join(' ')}</td>
                <td>
                  <a href="javascript:;" data-id={user.id} onClick={() => getUser(user.id)}>
                    View
                  </a>
                  &nbsp;
                  <a href="javascript:;" data-id={user.id} onClick={() => delUser(user.id)}>
                    Remove
                  </a>
                </td>
              </tr>
            ))}
          </table>
          <pre>
            <code>{user && JSON.stringify(user, null, 2)}</code>
          </pre>
        </div>
      );
    };
  },
});
