import app from '../hono/hono';
import emailService from '../service/email-service';
import result from '../model/result';

app.get('/sysEmail/list',async (c) => {
	const data = await emailService.allList(c, c.req.query());
	return c.json(result.ok(data));
})

app.delete('/sysEmail/delete',async (c) => {
	const list = await emailService.physicsDelete(c, c.req.query());
	return c.json(result.ok(list));
})
