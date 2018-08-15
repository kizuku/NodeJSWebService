import "babel-polyfill";

const axios = require('axios')
import nodeRSA from 'node-rsa'
const x509 = require('x509.js')
const getPem = require('rsa-pem-from-mod-exp')
const CryptoJS = require('crypto-js')
const path = require('path')

const timestamp = (timestamp) => {
    const time = new Date(timestamp);
    const currTime = new Date();

    const diff = (currTime.getTime() - time.getTime()) / 1000;

    if (diff <= 150 && diff >= -150) {
        return true;
    } else {
        return false;
    }
}

const signature = async (url, signature, body) => {

    const result = await axios.get(url);

    // Grabs cert data
    let certs = result.data;
    certs = certs.split('-----END CERTIFICATE-----\n');

    var arrSize = certs.length
    for (var i = 0; i < arrSize - 1; i++) {
        certs[i] = certs[i] + '-----END CERTIFICATE-----\n';

        const parsedCert = x509.parseCert(certs[i])

        const beforeDate = parsedCert.notBefore,
            afterDate = parsedCert.notAfter,
            currentDate = new Date();

        if (currentDate < beforeDate || currentDate > afterDate) throw new Error('error: certificate has invalid dates')
    }

    const SAN = x509.parseCert(certs[0]).subject.commonName

    if (SAN !== 'echo-api.amazon.com') throw new Error('error: certificate has invalid domain')

    // check for root CA cert
    const rootCert = x509.parseCert(certs[arrSize - 2]).issuer.organizationalUnitName;

    // "Class 3 Public Primary Certification Authority"
    if (rootCert.substring(rootCert.length - 23, rootCert.length) !== 'Certification Authority') throw new Error('error: trusted root CA certificate not found')



    // Parse the cert to a Javascript object
    const cert = x509.parseCert(certs[0])

    // Create a new nodeRSA object
    const key = new nodeRSA();

    // Import a key from the certificate data.
    // We are only provided a public modulus, which is in hex format.
    // The following code will import a public key using a supplied public modulus in hex format: 
    // (note that the public exponent is apparently not used to generate a public key.. 
    // this is what I've seen in documentation)
    key.importKey({
        n: Buffer.from(cert.publicModulus, 'hex'),
        e: 65537,
    }, 'components-public')

    // Decrypt the signature using the public key. 
    // We are letting nodeRSA know the string is base64 encoded.
    const dec = key.decryptPublic(signature, 'base64')

    const derivedHash = CryptoJS.SHA1(body)


    console.log("Decrypted: " + dec)

    //console.log("Begin Cert:\n\n"+JSON.stringify(cert)+"\n\nEnd Cert")

    //let modulus = x509.parseCert(certs[0]).publicModulus
    //let exp = x509.parseCert(certs[0]).publicExponent

    //modulus = new Buffer.from(modulus, 'hex').toString('base64')
    //exp = new Buffer.from(exp, 'hex').toString('base64')

    // const publicKey = getPem(modulus, exp)
    //const key = new nodeRSA(publicKey, 'pkcs1-public-pem', {signingScheme: 'pkcs1-sha1'})
    //console.log("assertedHash: " + assertedHash)
    //console.log("derivedHash: " + derivedHash)




    if (assertedHash !== derivedHash) {
        throw new Error('error: hashes do not match')
    }
}

const certificateURL = (url) => {
    const protocol = url.substring(0, 8).toLowerCase();
    if (protocol !== 'https://') throw new Error('error: invalid protocol')

    let body = url.substring(8)
    body = path.normalize(body)
    body = body.replace(new RegExp(/\\/g), '/')

    let array = body.split('/')
    if (array.length !== 3) throw new Error('error: url does not have 3 elements')

    switch (array[0].length) {
        case 20:
            if (array[0].toLowerCase().substring(0, 16) !== 's3.amazonaws.com') throw new Error('error: invalid hostname')
            if (array[0].substring(16) !== ':443') throw new Error('error: invalid port')
            break
        case 16:
            if (array[0].toLowerCase() !== 's3.amazonaws.com') throw new Error('error: invalid hostname')
            break
        default:
            throw new Error('error: invalid hostname')
    }

    if (array[1] !== 'echo.api') throw new Error('error: invalid path')
}

const Verify = {
    timestamp: timestamp,
    signature: signature,
    certificateURL: certificateURL
}
export default Verify;