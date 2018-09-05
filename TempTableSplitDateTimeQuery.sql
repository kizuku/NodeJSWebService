CREATE TABLE ##TempTable (
	Category NVARCHAR(50),
	occurDate nvarchar(50),
	occurTime nvarchar(50),
	alarmWord nvarchar(250),
	attribute nvarchar(50),
	description nvarchar(250),
	level nvarchar(50),
	moduleDesc nvarchar(250)
)

INSERT INTO ##TempTable
SELECT Category, convert(date, [occurTime]), convert(time(3), [occurTime]), alarmWord, attribute, description, level, moduleDesc
FROM <original database>
WHERE state = 'ACT/UNACK'

SELECT * FROM ##TempTable