const W = 500;
const HT = 90;
const HM = 400;
const HL = 5;
const HB = 90;

let currentID = 0;

let info;
let infoHeight;
let offset = 0;
let offsetDir = 1;
let timeout = 0;

let bUpdate;
let bConnect;
let challengeID;
let title;
let startDate;
let scrollSpeed;
let scrollSpeedValue;
let pauseDuration;
let pauseDurationValue;

function setup() {
	bUpdate = select('#bUpdate').elt;
	bConnect = select('#bConnect').elt;
	const bAddChallenge = select('#bAddChallenge');
	const bClear = select('#bClearAll');
	const bExport = select('#bExportCode');
	const bImport = select('#bImportCode');
	const iChallengeCode = select('#iChallengeCode');
	challengeID = select('#iChallengeID');
	title = select('#iTitle');
	startDate = select('#iStartDate');
	scrollSpeed = select('#iScrollSpeed');
	scrollSpeedValue = select('#iScrollSpeedValue').elt;
	pauseDuration = select('#iPauseDuration');
	pauseDurationValue = select('#iPauseDurationValue').elt;
	const challengeTBody = select('#challenges>tBody').elt;

	const params = getURLParams();
	if (params.code) {
		params.code = decodeURI(params.code);
		loadChallengeSettingFromCode(challengeTBody, params.code);
	} else {
		loadChallengeSettingFromCode(challengeTBody, getItem('challengeCode'));
	}

	const host =
		location.hostname == '127.0.0.1' || location.hostname == 'localhost'
			? 'http://127.0.0.1:3000'
			: `https://win-challenge-backend${getURLPath().includes('dev') ? '-dev' : ''}.up.railway.app`;

	bUpdate.addEventListener('click', event => {
		fetch(host + '/settings/' + challengeID.value(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(jsonSettings()),
		}).then(res => {
			if (res.ok) updated(true);
		});
	});
	updated(false);

	let challengeUpdateSource;
	bConnect.addEventListener('click', event => {
		if (bConnect.hasAttribute('active')) {
			challengeUpdateSource.close();
			connected(false);
		} else {
			challengeUpdateSource = new EventSource(host + '/settings/' + challengeID.value());
			challengeUpdateSource.onopen = event => connected(true);
			challengeUpdateSource.addEventListener('connect', event => connected(true));
			challengeUpdateSource.onmessage = event => {
				loadChallengeSettingFromCode(challengeTBody, JSON.parse(event.data));
				updated(true);
			};
			challengeUpdateSource.onerror = event => connected(false);
		}
	});
	connected(false);

	challengeID.input(settingsChanged);
	title.input(settingsChanged);
	startDate.input(settingsChanged);
	scrollSpeed.input(event => {
		settingsChanged();
		scrollSpeedValue.textContent = nf(scrollSpeed.value(), 0, 2);
	});
	pauseDuration.input(event => {
		settingsChanged();
		pauseDurationValue.textContent = int(pauseDuration.value());
	});

	bAddChallenge.mousePressed(() => {
		let challengeID;
		do {
			challengeID = '-id-' + currentID++;
		} while (select('.' + challengeID));

		addChallengeSetting(challengeTBody, challengeID);
	});

	bClear.mousePressed(() => loadChallengeSettingFromCode(challengeTBody, null));

	bExport.mousePressed(() => iChallengeCode.value(JSON.stringify(jsonSettings())));

	bImport.mousePressed(() => loadChallengeSettingFromCode(challengeTBody, iChallengeCode.value()));

	createCanvas(W, HT + HL + HM + HL + HB);

	noStroke();
	textAlign(CENTER, CENTER);
	textSize(HT * 0.5);
	textStyle(BOLD);
	info = createGraphics(W - 50, HM - 10);
	info.stroke(0, 100);
	info.textAlign(LEFT, TOP);
	info.textSize(HT * 0.47);
	info.textStyle(BOLD);
	info.textLeading(HT * 0.52);
}

function draw() {
	clear();

	fill(163, 224, 201);
	rect(0, 0, W, HT);
	fill(70, 85, 80);
	rect(0, HT, W, HL);

	fill(50, 60, 60, 150);
	rect(0, HT + HL, W, HM);

	fill(150, 200, 175);
	rect(0, HT + HL + HM, W, HL);
	fill(70, 85, 80);
	rect(0, HT + HL + HM + HL, W, HB);

	if (title.value()) fill(50, 60, 58);
	else fill(125, 175, 150);
	textAlign(CENTER, CENTER);
	textSize(HT * 0.5);
	textStyle(BOLD);
	text(title.value() || 'title', W / 2, HT / 2);

	let h = 0;
	info.clear();
	const challenges = selectAll('.challenge');
	for (let i = 0; i < challenges.length; i++) {
		const challengeID = challenges[i].elt.classList[1];
		const challenge = getChallenge(challengeID);

		if (challenge.finished) info.fill(100, 200, 100);
		else info.fill(235, 245, 255);

		let challengeInfo = challenge.name;
		if (challenge.current || challenge.total) challengeInfo += ' ' + (challenge.current ?? 0);
		if (challenge.total) challengeInfo += '/' + challenge.total;

		info.text(challengeInfo, 0, h - offset, W - 50);

		h += HT * 0.52 + HT * 0.2;
		if (info.textWidth(challengeInfo) > W - 52) h += HT * 0.52;

		if (i + 1 == challenges.length) continue;
		info.fill(70, 85, 80, 100);
		info.rect(0, h - offset - HT * 0.19, W - 52, HL);
	}
	h -= HT * 0.13;
	infoHeight = h;
	image(info, 25, HT + HL + 10);

	if (startDate.value()) {
		fill(235, 245, 255);
		const millis = Date.now() - new Date(startDate.value());
		const secs = Math.floor(millis / 1000);
		const mins = Math.floor(secs / 60);
		const hours = Math.floor(mins / 60);
		text(`${nf(hours, 2, 0)}:${nf(mins % 60, 2, 0)}:${nf(secs % 60, 2, 0)}`, W / 2, HT + HM + HL + HB / 2 + 9);
	} else {
		fill(163, 224, 201);
		text('00:00:00', W / 2, HT + HM + HL + HB / 2 + 9);
	}

	if (timeout > 0) {
		timeout -= 1;
		return;
	}

	offset += offsetDir * scrollSpeed.value();
	if (offset < 0) {
		timeout = pauseDuration.value();
		offset = 0;
		offsetDir *= -1;
	}
	if (offset > infoHeight - HM) {
		timeout = pauseDuration.value();
		offset = max(0, infoHeight - HM);
		offsetDir *= -1;
	}
}

function mousePressed(event) {
	const classList = event.target.classList;
	if (classList.contains('cRemoveChallenge')) {
		const challenge = select('.challenge.' + classList[1]);
		challenge.remove();
	} else if (classList.contains('cMoveChallengeUp')) {
		const challenge = select('.challenge.' + classList[1]).elt;
		const challengeAbove = challenge.previousElementSibling;
		challengeAbove?.before(challenge);
	} else if (classList.contains('cMoveChallengeDown')) {
		const challenge = select('.challenge.' + classList[1]).elt;
		const challengeBelow = challenge.nextElementSibling;
		challengeBelow?.after(challenge);
	}
}

function loadChallengeSettingFromCode(tBody, code) {
	if (typeof code === 'string' || code instanceof String) code = JSON.parse(code);
	challengeID.value(code?.challengeID ?? '');
	title.value(code?.title ?? '');
	startDate.value(code?.startDate ?? '');
	scrollSpeed.value(code?.scrollSpeed ?? 0.25);
	scrollSpeedValue.textContent = nf(scrollSpeed.value(), 0, 2);
	pauseDuration.value(code?.pauseDuration ?? 300);
	pauseDurationValue.textContent = int(pauseDuration.value());
	while (tBody.firstChild) tBody.removeChild(tBody.lastChild);
	if (code?.challenges)
		for (const challenge of code.challenges) addChallengeSetting(tBody, challenge.id, challenge.name, challenge.current, challenge.total, challenge.finished);
}

function addChallengeSetting(tBody, challengeID, name, current, total, finished) {
	const trChallenge = document.createElement('tr');
	const tdName = document.createElement('td');
	const tdCurrent = document.createElement('td');
	const tdTotal = document.createElement('td');
	const tdFinished = document.createElement('td');
	const tdMoveUp = document.createElement('td');
	const tdMoveDown = document.createElement('td');
	const tdRemove = document.createElement('td');

	const iName = document.createElement('input');
	const iCurrent = document.createElement('input');
	const iTotal = document.createElement('input');
	const iFinished = document.createElement('input');
	const iMoveUp = document.createElement('input');
	const iMoveDown = document.createElement('input');
	const iRemove = document.createElement('input');

	trChallenge.className = 'challenge ' + challengeID;
	iName.className = 'cName ' + challengeID;
	iCurrent.className = 'cCurrent ' + challengeID;
	iTotal.className = 'cTotal ' + challengeID;
	iFinished.className = 'cFinished ' + challengeID;
	iMoveUp.className = 'cMoveChallengeUp ' + challengeID;
	iMoveDown.className = 'cMoveChallengeDown ' + challengeID;
	iRemove.className = 'cRemoveChallenge ' + challengeID;

	iName.setAttribute('type', 'text');
	iCurrent.setAttribute('type', 'number');
	iTotal.setAttribute('type', 'number');
	iFinished.setAttribute('type', 'checkbox');
	iMoveUp.setAttribute('type', 'button');
	iMoveDown.setAttribute('type', 'button');
	iRemove.setAttribute('type', 'reset');

	iName.title = 'Name';
	iName.placeholder = 'Name';
	iCurrent.title = 'Current Wins';
	iTotal.title = 'Needed Wins';
	iFinished.title = 'Finished Challenge';
	iMoveUp.title = 'Move Challenge Up';
	iMoveDown.title = 'Move Challenge Down';
	iRemove.title = 'Remove Challenge';

	if (name) iName.setAttribute('value', name.replaceAll(/\n/g, '\\n'));
	if (current) iCurrent.setAttribute('value', current);
	if (total) iTotal.setAttribute('value', total);
	if (finished) iFinished.setAttribute('checked', '');

	iMoveUp.setAttribute('value', '↑');
	iMoveDown.setAttribute('value', '↓');
	iRemove.setAttribute('value', 'x');

	iName.addEventListener('input', settingsChanged);
	iCurrent.addEventListener('input', settingsChanged);
	iTotal.addEventListener('input', settingsChanged);
	iFinished.addEventListener('input', settingsChanged);
	iMoveUp.addEventListener('input', settingsChanged);
	iMoveDown.addEventListener('input', settingsChanged);
	iRemove.addEventListener('input', settingsChanged);

	tdName.appendChild(iName);
	tdCurrent.appendChild(iCurrent);
	tdTotal.appendChild(iTotal);
	tdFinished.appendChild(iFinished);
	tdMoveUp.appendChild(iMoveUp);
	tdMoveDown.appendChild(iMoveDown);
	tdRemove.appendChild(iRemove);

	trChallenge.appendChild(tdName);
	trChallenge.appendChild(tdCurrent);
	trChallenge.appendChild(tdTotal);
	trChallenge.appendChild(tdFinished);
	trChallenge.appendChild(tdMoveUp);
	trChallenge.appendChild(tdMoveDown);
	trChallenge.appendChild(tdRemove);

	tBody.appendChild(trChallenge);
}

function jsonSettings() {
	const challenges = [];
	for (const challenge of selectAll('.challenge')) {
		const challengeID = challenge.elt.classList[1];
		challenges.push(getChallenge(challengeID));
	}

	return {
		challengeID: challengeID.value(),
		title: title.value(),
		startDate: startDate.value(),
		scrollSpeed: scrollSpeed.value(),
		pauseDuration: pauseDuration.value(),
		challenges,
	};
}

function getChallenge(challengeID) {
	const iName = select('.cName.' + challengeID).elt;
	const iCurrent = select('.cCurrent.' + challengeID).elt;
	const iTotal = select('.cTotal.' + challengeID).elt;
	const iFinished = select('.cFinished.' + challengeID).elt;

	const id = challengeID;
	const name = iName.value.replaceAll('\\n', '\n');
	const current = Number(iCurrent.value);
	const total = Number(iTotal.value);
	const finished = iFinished.checked ?? false;

	return { id, name, current, total, finished };
}

function settingsChanged() {
	storeItem('challengeCode', jsonSettings());
	updated(false);
}

function updated(bool) {
	if (bool) {
		bUpdate.setAttribute('active', '');
		bUpdate.setAttribute('value', 'Updated');
		bUpdate.setAttribute('title', 'Overlays are up to date');
	} else {
		bUpdate.removeAttribute('active');
		bUpdate.setAttribute('value', 'Update');
		bUpdate.setAttribute('title', 'Update Overlays with current Settings');
	}
}

function connected(bool) {
	if (bool) {
		bConnect.setAttribute('active', '');
		bConnect.setAttribute('value', 'Connected');
		bConnect.setAttribute('title', 'Receiving Overlay Updates');
	} else {
		bConnect.removeAttribute('active');
		bConnect.setAttribute('value', 'Connect');
		bConnect.setAttribute('title', 'Connect to receive Overlay Updates');
	}
}
