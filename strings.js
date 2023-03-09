const crypto = require('crypto');

async function random(length = 16) {
	string = '';

	while ((len = string.length) < length) {
        size = length - len;

        bytes = await random_bytes(size);
        string += bytes;
    }

    return string;
}

function sha256(string) {
	return crypto.createHash('sha256').update(string).digest('hex');
}

async function random_bytes(size) {
	return new Promise(function (resolve, reject) {
		crypto.randomBytes(size, (err, buf) => {
  			if (err) return reject(err);

  			return resolve(buf.toString('hex'));
  		});
	});
}

module.exports = {random, sha256}