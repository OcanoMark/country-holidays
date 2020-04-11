<?php
	$url = $_GET["url"];
	
	if(isset($url)) {
		//Use file_get_contents to GET the URL in question.
		$contents = file_get_contents($url);
		
		//Print out the contents.
		echo $contents;
	}
?>