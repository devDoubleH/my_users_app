const container = document.getElementById('container');

fetch('http://localhost:3000/users')
.then(response => response.json())
.then(data => {
    data.forEach(user => {
        console.log(user);
        container.innerHTML += `
        <tr>
            <td>${user.firstname}</td>
            <td>${user.lastname}</td>
            <td>${user.age}</td>
            <td>${user.email}</td>
        </tr>
        `
    })
});