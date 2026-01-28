const users = Object.fromEntries(
    process.env.BASIC_AUTH_USERS
    .split(",")
    .map(item => item.split(":"))
);

async function basicAuth(req, res, next) {
    // make authenticate path public
    if (req.path === '/users/authenticate') {
        return next();
    }

    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    // const user = await userService.authenticate({ username, password });
    // Pengecekan username dan password dari env
    if (!users[username] || users[username] !== password) {
        return res.status(401).json({ message: 'Invalid Authentication Credentials' });
    }

    // attach user to request object
    req.username = username; 

    next();
}

export default basicAuth;