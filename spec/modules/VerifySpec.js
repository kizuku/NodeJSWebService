import Verify from '../../src/modules/Verify'

describe("The Verify module", () => {
	it("contains a timestamp verifier", () => {
		expect(Verify.timestamp).toBeDefined();
	});
	it("contains a signature verifier", () => {
		expect(Verify.signature).toBeDefined();
	});
	it("contains a certificateURL verifier", () => {
		expect(Verify.certificateURL).toBeDefined();
	});
});

describe("The timestamp verifier", () => {
	it("throws an error when the input is not an integer.", () => {
		expect(() => {
			Verify.timestamp('abs')
		}).toThrowError('Timestamp value must be an integer')
		expect(() => {
			Verify.timestamp()
		}).toThrowError('Timestamp must be provided')
	})
	
	it("makes sure that the supplied timestamp is +/- 150 seconds from current time", () => {
		const testStampTrue = new Date().getTime() - 150000
		const testStampFalse1 = new Date("5/5/1977").getTime()
		const testStampFalse2 = new Date().getTime() - 150001
		expect(Verify.timestamp(testStampTrue)).toEqual(true)
		expect(Verify.timestamp(testStampFalse1)).toEqual(false)
		expect(Verify.timestamp(testStampFalse2)).toEqual(false)
	})
})