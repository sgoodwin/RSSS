require 'net/http'
require 'uri'
require 'rubygems'
require 'yajl'

def parse_json(string)
  parser = Yajl::Parser.new
  parser.parse(StringIO.new(string)){|obj| puts obj}
end

# Make sure all routes work:
puts "Executing basic checks, if anything fails you'll know you messed up:\r\n\r\n"

def check_home
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000");
  puts res.body;
end
check_home

def check_new_user
  # Possible Requests:
  # GET new User (returns a new random string)
  puts "\r\n\r\nNew User:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/newuser.json");
  parse_json(res.body);
end
#check_new_user

def check_check_user
  # GET check User (verifies that a userID is valid)
  puts "\r\n\r\nCheck User:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/check.json?key=1");
  parse_json(res.body);
end
check_check_user

def check_user_invalid
  # GET check User (verifies that a userID is valid) with invalid user
  puts "\r\n\r\nCheck User with invalid:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/check.json?key=defdoesnotexist");
  parse_json(res.body);
end
check_user_invalid

def check_new_feed
  # POST feeds (new)
  puts "\r\n\r\nJSON New Feed from valid user:"
  res = Net::HTTP.post_form(URI.parse('http://0.0.0.0:3000/feed.json'),{'key'=>'1', 'title'=>'Denver Skate Shop', 'rssURL'=>'http://denverskateshop.blogspot.com/feeds/posts/default', 'htmlURL'=>'http://denverskateshop.blogspot.com/'})
  parse_json(res.body);
end
#check_new_feed

def check_new_feed_invalid
  # # POST feeds (new) from an invalid user
  puts "\r\n\r\nNew Feed from invalid user:"
  res = Net::HTTP.post_form(URI.parse('http://0.0.0.0:3000/feed.json'),{'key'=>'defdoesnotexist', 'title'=>'Denver Skate Shop', 'rssURL'=>'http://denverskateshop.blogspot.com/feeds/posts/default', 'htmlURL'=>'http://denverskateshop.blogspot.com/'})
  puts res.body;
end
check_new_feed_invalid

# PUT feeds (update)
def check_update_feed
  puts "\r\n\r\nUpdate Feed:"
  uri = URI.parse("http://0.0.0.0:3000/feed.json")
  Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/x-www-form-urlencoded'}
    put_data = "key=1&uid=1&title=SomethingDifferent"
    res = http.send_request('PUT', uri.request_uri, put_data, headers) 
    puts res.body
  end
end
#check_update_feed

# DESTROY feeds
def check_destroy_feed
  puts "\r\n\r\nDestroy Feed:"
  uri = URI.parse("http://0.0.0.0:3000/feed/6")
  Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/x-www-form-urlencoded'}
    put_data = "key=1"
    res = http.send_request('DELETE', uri.request_uri, put_data, headers) 
    puts res.body
  end
end
check_destroy_feed

# DESTROY feeds
def check_destroy_feed_invalid
  puts "\r\n\r\nDestroy Feed Invalid:"
  uri = URI.parse("http://0.0.0.0:3000/feed/6")
  Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/x-www-form-urlencoded'}
    put_data = "key=defnotauser"
    res = http.send_request('DELETE', uri.request_uri, put_data, headers) 
    puts res.body
  end
end
check_destroy_feed_invalid

puts "\r\n\r\nOPML Feed List:";
def check_feedlist_opml
  # GET feedlist (conditional GET should also be tested)
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.opml?key=1");
  return res
end
puts check_feedlist_opml.body

def check_feedlist_json_conditional
  # GET feedlist conditional GET
  puts "\r\n\r\nJSON Feed List (conditional GET):";
  initial_res = check_feedlist_opml
  modified_since = initial_res['last-modified']
  
  uri = URI.parse("http://0.0.0.0:3000/feedlist.json?key=1");
  Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/x-www-form-urlencoded', 'If-Modified-Since' => modified_since}
    put_data = "key=1"
    res = http.send_request('GET', uri.request_uri, put_data, headers) 
    puts res.code
    return res.body
  end
end
puts check_feedlist_json_conditional

def check_feedlist_json
  # GET feedlist
  puts "\r\n\r\nJSON Feed List:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.json?key=1");
  parse_json(res.body);
end
check_feedlist_json

def check_feedlist_invalid
  # GET feedlist with a user that don't exist;
  puts "\r\n\r\nOPML Feed List From a non-user:";
  res = Net::HTTP.get_response URI.parse("http://0.0.0.0:3000/feedlist.opml?key=defdoesnotexist");
  puts res.body;
end
check_feedlist_invalid

# GET status changes since date
def check_get_status
  puts "\r\n\r\nGetting status update:"
  uri = URI.parse("http://0.0.0.0:3000/status.json?key=1&dateTime=Tue%20Nov%202%202010%2022%3A29%3A06%20GMT-0700%20%28MST%29");
  res = Net::HTTP.get_response uri;
  puts res.body
end
check_get_status

# POST update status (input JSON/XML)
def check_post_status
  puts "\r\n\r\nPOST status update:"
  uri = URI.parse("http://0.0.0.0:3000/status.json")
  Net::HTTP.start(uri.host, uri.port) do |http|
    headers = {'Content-Type' => 'application/x-www-form-urlencoded'}
    string = Yajl::Encoder.encode([{'uid'=>'1', 'status'=>'read'}])
    put_data = "key=1&data=#{string}"
    res = http.send_request('POST', uri.request_uri, put_data, headers) 
    puts res.body
  end
end
check_post_status