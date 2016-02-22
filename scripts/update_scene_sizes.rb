#!/usr/bin/env ruby

content_dir = if ARGV.empty? then "../content" else ARGV[0] end
unless File.exists?(content_dir)
  puts "Content dir '#{content_dir}' does not exist."
  exit 1
end

line_speed_file = if ARGV.size < 2
  File.join(content_dir, "shared", "js", "line_speed.js") else ARGV[1] end

output = "var scene_sizes = {\n"
Dir[File.join(content_dir, "**", "*.bin")].sort.each do |bin_path|
  json_path = bin_path.sub(/\.bin$/, ".json")
  scene_name = File.basename(File.dirname(bin_path))
  scene_size = File.size(json_path) + File.size(bin_path)
  output += "  #{scene_name}: #{scene_size},\n"
end
output.chomp!(",\n")
output += "\n}"

content = IO.read(line_speed_file)
content.sub!(/var scene_sizes.*\n(?:[^}]*\n)*}/, output)
IO.write(line_speed_file, content)