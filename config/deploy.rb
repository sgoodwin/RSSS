set :application, "RSSS"
set :repository,  "git://github.com/sgoodwin/RSSS.git"
set :scm, :git
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`
set :deploy_to,   "~/#{application}"

role :web, "rsss"                          # Your HTTP server, Apache/etc
role :app, "rsss"                          # This may be the same as your `Web` server
role :db,  "rsss", :primary => true

namespace :deploy do
  task :start, :roles => :app do
    restart
  end

  task :stop, :roles => :app do
    run "/var/lib/gems/1.9.0/bin/god stop node-god-rsss-instances"
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "/var/lib/gems/1.9.0/bin/god stop node-god-rsss-instances"
    run "/var/lib/gems/1.9.0/bin/god load #{File.join deploy_to, 'current', 'node.god'}"
    run "/var/lib/gems/1.9.0/bin/god start node-god-rsss-instances"
  end
end