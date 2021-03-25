--temp = math.random(3) TODO

function onCycle()

end

function onCall(callnum)
	if callnum == 1 then	--registerPhotographer POST
		return "[POST]{\"input\": \"{\\\"userId\\\": \\\"user_a\\\", \\\"s3Bucket\\\":\\\"BUCKETPLACEHOLDER\\\", \\\"s3Key\\\": \\\"1_happy_face.jpg\\\"}\", \"stateMachineArn\": \"STATEMACHINEARNPLACEHOLDER\"}URLPLACEHOLDER"
	elseif callnum == 2 then	--newProduct POST
		return "[POST]{\"input\": \"{\\\"userId\\\": \\\"user_a\\\", \\\"s3Bucket\\\":\\\"BUCKETPLACEHOLDER\\\", \\\"s3Key\\\": \\\"4_no_face.jpg\\\"}\", \"stateMachineArn\": \"STATEMACHINEARNPLACEHOLDER\"}URLPLACEHOLDER"
	else
		--listCategories GET
		--listProductsByCategory GET
		--listProductsByID GET
		--commitPhoto POST
		return nil;
	end
end
