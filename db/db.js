const dbConfig = require('./config.js');
const common = require('../common.js');
const systemConfig = require('../systemConfig.js');
const mysql = require('mysql');

let connection = null;

module.exports = {
    query: function (params, logInfo) {
        if (dbConfig.logLogInfo === true) {
            console.log('Log Info:');
            console.log(logInfo);
        }
        if (dbConfig.logParams === true) {
            console.log('Params:');
            console.log(params);
        }
        return new Promise(function (resolve) {
            module.exports.getConnection()
                .then(function (connection) {
                    let sql = 'CALL ' + logInfo.source + '(';
                    if (params) {
                        let questionMark = [];
                        for (let i = 0; i < params.length; i++) {
                            questionMark.push('?');
                        }
                        sql = sql + questionMark.join(',');
                    }
                    sql = sql + ')';
                    let formatQuery = mysql.format(sql, params);
                    connection.query(formatQuery, async function (queryError, selectResult, fields) {
                        if (queryError) {
                            let consoleMessage = 'Result code 901. Error while executing a query from database:\n' + queryError;
                            await logErrorToDB(logInfo, consoleMessage);
                            resolve({ resultCode: 901, });
                            return;
                        }
                        let resultCode = selectResult[0][0].result;
                        if (resultCode == null) {
                            let errorMessage = 'Result code 902. No result code found in database response: ' + logInfo.source;
                            await logErrorToDB(logInfo, errorMessage);
                            resolve({ resultCode: 902, });
                            return;
                        }
                        let result = {
                            sqlResults: selectResult,
                            fields: fields,
                            resultCode,
                        };
                        resolve(result);
                    });
                });
        });
    },


    getConnection: function () {
        return new Promise(function (resolve) {
            if (connection == null) {
                createConnection()
                    .then(function (result) {
                        connection = result;
                        resolve(result);
                    });
            } else {
                resolve(connection);
            }
        });
    },

    closeConnection: function () {
        if (connection == null) {
            common.consoleLog('Database connection does not exist.');
            return;
        }
        return new Promise(function (resolve) {
            try {
                connection.end();
                common.consoleLog('Database connection was closed successfully.');
                resolve();
            } catch (closingError) {
                common.consoleLogError('Error while closing database connection:\n' + closingError + '.');
                connection.destroy();
                resolve();
            }
        });
    },
};

function createConnection() {
    return new Promise(function (resolve) {
        let aConnection = mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.initDB,
            port: dbConfig.port,
        });
        aConnection.connect(function (connectionError) {
            if (connectionError) {
                common.consoleLogError('Error while connecting to database:\n' + connectionError + '.');
                resolve(null);
                return;
            }
            common.consoleLog('Database connected with id ' + aConnection.threadId + '.');
            resolve(aConnection);
        });
    });
};

function logErrorToDB(logInfo, errorMessage) {
    return new Promise(function (resolve) {
        module.exports.getConnection()
            .then(function (connection) {
                let logErrorParams = [logInfo.username, logInfo.source, logInfo.userIP, errorMessage];
                let formatQuery = mysql.format('CALL ' + systemConfig.systemName + '`_system`.`SYSTEM_LOG_ERROR`(?, ?, ?, ?)', logErrorParams);
                connection.query(formatQuery, function (logError) {
                    if (logError) {
                        common.consoleLogError(errorMessage + '.\nFailed to log error to database. Log error:\n' +
                            logError + '.');
                        resolve(false);
                    }
                    common.consoleLogError(errorMessage + '.\nError logged.');
                    resolve(true);
                });

            });
    });
};