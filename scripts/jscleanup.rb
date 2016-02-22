#!/usr/bin/env ruby
Dir["*/index.html"].each do |file|
   referenced_files = []
   unused_files = []
   mod_dir = File.dirname(file)
   IO::read(file).lines do |line|
      if line =~ /<script.*?src="([^"]*)">/
         js_file = File.join(mod_dir, $1)
         referenced_files << File.realpath(js_file) if File.exists?(js_file)
      end
   end
   unused_files = Dir[File.join(mod_dir, "js/*.js")].map {|f| File.realpath(f)} - referenced_files
   unused_files.each {|f| File.unlink(f)}
end
