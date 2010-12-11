set :application, "RSSS"
set :name, "node-god-rsss-instances"
set :repository,  "git://github.com/sgoodwin/RSSS.git"
set :use_sudo,    false
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
    sudo "god stop #{name}"
    sudo "god load #{File.join deploy_to, 'current', 'god.config'}"
    sudo "god start #{name}"
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    sudo "god restart #{name}"
  end
end