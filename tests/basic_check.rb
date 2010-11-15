require 'net/http'
require 'uri'
require 'rubygems'
require 'yajl'

def parse_json(string)
  parser = Yajl::Parser.new
  parser.parse(StringIO.new(string)){|obj| puts obj}
end

# Make sure all routes work:
puts "Executing basic checks, if anything fails you'll know you messed up:"

def check_new_user
  # Possible Requests:
  # GET new User (returns a new random string)
  puts "\r\n\r\nNew User:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/newuser.json");
  parse_json(res.body)
end
check_new_user

def check_check_user
  # GET check User (verifies that a user_id is valid)
  puts "\r\n\r\nCheck User:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/check.json?key=1");
  parse_json(res.body)
end
check_check_user

def check_user_invalid
  # GET check User (verifies that a user_id is valid) with invalid user
  puts "\r\n\r\nCheck User with invalid:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/check.json?key=defdoesnotexist");
  parse_json(res.body)
end
check_user_invalid

def check_feedlist_opml
  # GET feedlist (conditional GET should also be tested)
  puts "\r\n\r\nOPML Feed List:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.opml?key=1");
  puts res.body
end
check_feedlist_opml

def check_feedlist_json
  # GET feedlist
  puts "\r\n\r\nOPML JSON List:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.json?key=1");
  parse_json(res.body)
end
check_feedlist_json

def check_feedlist_invalid
  # GET feedlist with a user that don't exist;
  puts "\r\n\r\nOPML Feed List From a non-user:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.opml?key=defdoesnotexist");
  puts res.body
end
check_feedlist_invalid

def check_new_feed
  # POST feeds (new)
  puts "\r\n\r\nJSON New Feed from valid user:"
  res = Net::HTTP.post_form(URI.parse('http://0.0.0.0:3000/feed.json'),{'key'=>'1', 'title'=>'Denver Skate Shop', 'rss_url'=>'http://denverskateshop.blogspot.com/feeds/posts/default', 'html_url'=>'http://denverskateshop.blogspot.com/'})
  parse_json(res.body)
end
#check_new_feed

def check_new_feed_invalid
  # # POST feeds (new) from an invalid user
  puts "\r\n\r\nNew Feed from invalid user:"
  res = Net::HTTP.post_form(URI.parse('http://0.0.0.0:3000/feed.json'),{'key'=>'defdoesnotexist', 'title'=>'Denver Skate Shop', 'rss_url'=>'http://denverskateshop.blogspot.com/feeds/posts/default', 'html_url'=>'http://denverskateshop.blogspot.com/'})
  puts res.body
end
check_new_feed_invalid

# PUT feeds (update)
# DESTROY feeds

# GET status changes since date
# POST update status (input JSON/XML)