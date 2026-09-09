export function localDate(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
export function paymentStatusFor(player, month) {
    var _a, _b;
    const currentMonth = localDate().slice(0, 7);
    return ((_b = (_a = (Array.isArray(player.paymentHistory) ? player.paymentHistory : []).find((payment) => payment.month === month)) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : (month === currentMonth ? player.paymentStatus : "unpaid"));
}
export function normalizePlayer(player) {
    return Object.assign(Object.assign({}, player), { attendance: Array.isArray(player.attendance) ? player.attendance : [], paymentHistory: Array.isArray(player.paymentHistory)
            ? player.paymentHistory
            : [] });
}
