# Make sure all routes work:
echo "Executing basic routing checks:"

# Possible Requests:
# GET new User (returns a new random string)
echo "\nNew User:";
curl "http://0.0.0.0:3000/newuser.json";

# GET check USer (verifies that a user_id is valid)
echo "\nCheck User:";
curl "http://0.0.0.0:3000/check.json?key=aaaaaaa";

# GET feedlist (conditional GET should also be tested)
echo "\Feed List:";
curl "http://0.0.0.0:3000/feedlist.opml";

# POST feeds (new)
# PUT feeds (update)
# DESTROY feeds

# GET status changes since date
# POST update status (input JSON/XML)