import pool from '../config/database.js';
const getIndex = (req, res) => {
	res.render('login', { title: 'Home' });
};
const postIndex = async (req, res) => {
	try {
		if (req.body.typeOfForm === 'login') {
			const [rows, fields] = await pool.execute('select * from player where username = ?', [
				req.body.username,
			]);
			if (rows.length == 1) {
				if (rows[0].lockacc == 1) {
					return res.render('login', {
						title: 'Home',
						msg: 'Your account is locked. Contact admin to know more information.',
					});
				}
				if (rows[0].password === req.body.password) {
					req.session.loggedin = true;
					req.session.username = req.body.username;
					req.session.role = rows[0].role;
					let njname = rows[0].ninja;
					njname = JSON.parse(njname);
					njname = njname[0];
					return res.render('home', {
						title: 'Home',
						username: req.session.username,
						njname,
					});
				} else {
					return res.render('login', { title: 'Home', msg: 'Wrong password' });
				}
			} else {
				return res.render('login', {
					title: 'Home',
					msg: 'Username was not found.',
				});
			}
		} else if (req.body.typeOfForm === 'register') {
			const [rows, fields] = await pool.execute('select * from player where username = ?', [
				req.body.username,
			]);
			if (rows.length == 1) {
				return res.render('login', { title: 'Home', msg: 'Username is exist.' });
			}
			if (req.body.password !== req.body.confirmPassword) {
				return res.render('login', { title: 'Home', msg: 'Passwords are not the same.' });
			} else {
				await pool.execute('insert player (username, password, lockacc) values (?, ?, 1)', [
					req.body.username,
					req.body.password,
				]);
				return res.render('login', { title: 'Home', msg: 'Register successfully.' });
			}
		} else if (req.body.typeOfForm == 'logout') {
			if (req.session.loggedin) {
				return req.session.destroy();
			}
		} else if (req.body.typeOfForm == 'changePassword') {
			const [rows, fields] = await pool.execute('select * from player where username = ?', [
				req.session.username,
			]);
			if (rows.length == 1) {
				if (rows[0].password === req.body.oldPass) {
					if (req.body.newPassword == req.body.confirmPassword) {
						pool.execute('update player set password = ? where username = ?', [
							req.body.newPassword,
							req.session.username,
						]);
						return res.render('home', {
							title: 'Home',
							username: req.session.username,
							msg: 'OK',
						});
					} else {
						return res.render('home', {
							title: 'Home',
							username: req.session.username,
							msg: 'Failed',
						});
					}
				} else {
					return res.render('home', {
						title: 'Home',
						username: req.session.username,
						msg: 'Failed',
					});
				}
			}
		} else if (req.body.typeOfForm == 'changeCharName') {
			try {
				let [rows, fields] = await pool.execute('select * from ninja where name = ?', [
					req.body.newCharName,
				]);
				if (rows.length != 1) {
					[rows, fields] = await pool.execute('select * from player where username = ?', [
						req.session.username,
					]);
					let njname = rows[0].ninja;
					njname = JSON.parse(njname);
					njname = njname[0];
					await pool.execute('update ninja set name = ? where name = ?', [
						req.body.newCharName,
						njname,
					]);
					await pool.execute(`update player set ninja = ? where username = ?`, [
						`["${req.body.newCharName}"]`,
						req.session.username,
					]);
				}
			} catch (err) {
				console.log(err);
				return res.render('home', {
					title: 'Home',
					username: req.session.username,
					msg: 'Failed.',
				});
			}
			return res.redirect('/');
		}
	} catch (error) {
		console.log(error);
	}
	return res.redirect('/');
};
const getItems = async (req, res) => {
	try {
		let [rows, fields] = await pool.execute('select * from item');
		const items = rows.map((item) => {
			let tmpItem = {};
			tmpItem.id = item.id;
			tmpItem.name = item.name;
			tmpItem.description = item.description;
			tmpItem.class = item.class;
			tmpItem.level = item.level;
			return tmpItem;
		});
		return res.render('items', { items: items });
	} catch (error) {
		console.log(error);
		return res.redirect('/');
	}
};
const getConsole = async (req, res) => {
	if (req.session.role == 'admin') {
		const [players, fld1] = await pool.execute('select * from player');
		return res.render('console', { players });
	}
	return res.redirect('/');
};
const ConsoleMethod = {
	unlockAccount: async (res, username) => {
		await pool.execute('update player set lockacc = 0 where username = ?', [username]);
		return res.json({ msg: 'OK' });
	},
	lockAccount: async (res, username) => {
		await pool.execute('update player set lockacc = 1 where username = ?', [username]);
		return res.json({ msg: 'OK' });
	},
	makeAdmin: async (res, username) => {
		await pool.execute('update player set role = ? where username = ?', ['admin', username]);
		return res.json({ msg: 'OK' });
	},
	cancelAdmin: async (res, username) => {
		await pool.execute('update player set role = ? where username = ?', ['user', username]);
		return res.json({ msg: 'OK' });
	},
};
const postConsole = (req, res) => {
	const username = req.body.username;
	if (req.session.role == 'admin') {
		const action = req.body.action;
		if (action == 'lock') {
			ConsoleMethod.lockAccount(res, username);
		} else if (action == 'unlock') {
			ConsoleMethod.unlockAccount(res, username);
		} else if (action == 'makeAdmin') {
			ConsoleMethod.makeAdmin(res, username);
		} else if (action == 'cancelAdmin') {
			ConsoleMethod.cancelAdmin(res, username);
		}
	}
};
const getHoaHoc = (req, res) => {
	return res.render('hoahoc');
};
export { getIndex, postIndex, getItems, getConsole, getHoaHoc, postConsole };
