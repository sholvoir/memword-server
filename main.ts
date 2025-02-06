import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from './mid/jwt.ts';
import admin from './mid/admin.ts';

import signup from "./pub/signup.ts";
import otp from "./pub/otp.ts";
import login from "./pub/login.ts";
import sound from "./pub/sound.ts";
import pub_dict from "./pub/dict.ts";
import pub_wordlist from "./pub/wordlist.ts";

import task from './auth/task.ts';
import issue from './auth/issue.ts';
import setting from './auth/setting.ts';
import auth_wordlist from "./auth/wordlist.ts";

import admin_dict from "./admin/dict.ts";
import admin_wordlist from "./admin/wordlist.ts";

const app = new Hono();
app.use(cors());

app.route('/signup', signup);
app.route('/otp', otp);
app.route('/login', login);
app.route('/sound', sound);
app.route('/dict', pub_dict);
app.route('/wordlist', pub_wordlist);

app.use('/api/*', jwt);
app.route('/api/task', task);
app.route('/api/issue', issue);
app.route('/api/setting', setting);
app.route('/api/wordlist', auth_wordlist);

app.use('/admin/*', jwt, admin);
app.route('/admin/dict', admin_dict);
app.route('/admin/wordlist', admin_wordlist);

Deno.serve(app.fetch)
