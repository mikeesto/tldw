// place files you want to import through the `$lib` alias in this folder.
export function iso8601ToSeconds(iso8601Duration) {
	const durationRegex =
		/(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
	const matches = iso8601Duration.match(durationRegex);

	const years = matches[2] === undefined ? 0 : parseInt(matches[2]);
	const months = matches[3] === undefined ? 0 : parseInt(matches[3]);
	const weeks = matches[4] === undefined ? 0 : parseInt(matches[4]);
	const days = matches[5] === undefined ? 0 : parseInt(matches[5]);
	const hours = matches[6] === undefined ? 0 : parseInt(matches[6]);
	const minutes = matches[7] === undefined ? 0 : parseInt(matches[7]);
	const seconds = matches[8] === undefined ? 0 : parseInt(matches[8]);

	const totalSeconds =
		years * 31536000 +
		months * 2592000 +
		weeks * 604800 +
		days * 86400 +
		hours * 3600 +
		minutes * 60 +
		seconds;

	return totalSeconds;
}
